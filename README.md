# visitormanagementsystem
#VMS



 # Terminal 1 — Backend (runs migrations on boot)
cd ~/Desktop/DBMS/backend && node server.js
# → http://localhost:3001

# Terminal 2 — Admin
cd ~/Desktop/DBMS/frontend && npm run dev
# → http://localhost:5173

# Terminal 3 — Public site
cd ~/Desktop/DBMS/public-site && npm install && npm run dev
# → http://localhost:5174
