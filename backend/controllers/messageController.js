const Message = require('../models/Message');
const Notification = require('../models/Notification');

exports.sendMessage = async (req, res) => {
  const { receiverId, text, gigId } = req.body;
  if (!receiverId || !text) return res.status(400).json({ message: 'receiverId and text are required' });

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    gig: gigId || null,
    text,
  });

  await message.populate('sender', 'name avatar');

  await Notification.create({
    user: receiverId,
    type: 'new_message',
    message: `New message from ${req.user.name}`,
    link: `/messages?with=${req.user._id}`,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit('new_message', message);
    io.to(receiverId.toString()).emit('notification', {
      type: 'new_message',
      message: `New message from ${req.user.name}`,
    });
  }

  res.status(201).json({ success: true, message });
};

exports.getConversation = async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  await Message.updateMany(
    { sender: userId, receiver: req.user._id, read: false },
    { read: true }
  );

  res.json({ success: true, messages });
};

exports.getInbox = async (req, res) => {
  const userId = req.user._id;
  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: -1 });

  const seen = new Set();
  const conversations = [];
  for (const msg of messages) {
    const otherId = msg.sender._id.toString() === userId.toString()
      ? msg.receiver._id.toString()
      : msg.sender._id.toString();
    if (!seen.has(otherId)) {
      seen.add(otherId);
      const other = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      const unread = await Message.countDocuments({ sender: otherId, receiver: userId, read: false });
      conversations.push({ user: other, lastMessage: msg, unread });
    }
  }

  res.json({ success: true, conversations });
};
