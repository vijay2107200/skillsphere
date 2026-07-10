@echo off
echo Starting SkillSphere...
start "SkillSphere Backend" cmd /k "cd /d C:\Users\vijay\skillsphere\backend && npm start"
timeout /t 3 /nobreak >nul
start "SkillSphere Frontend" cmd /k "cd /d C:\Users\vijay\skillsphere\frontend && npm start"
echo Both servers launching. Frontend will open at http://localhost:3000
