Video Me - HTML/CSS/JS Movie Website Template

Files:
- index.html
- styles.css
- app.js

How to use:
1. Extract the ZIP file.
2. Open index.html in your browser.
3. Click Admin.
4. Login:
   Username: admin
   Password: videome123
5. Add a video title, category, description, thumbnail, and DoodStream embed link/iframe code.
6. Click Save Video.

Important notes:
- This is a static HTML/CSS/JS template. It stores videos in the browser's localStorage.
- If you open the site from another device/browser, the saved videos will not appear unless you export/import backup JSON.
- For a real public website, use a backend with a database and secure login.
- Upload/embed only videos you own or have legal permission to use.
- Adult/18+ content should not be shown to minors. This template includes an 18+ warning modal.

To change admin username/password:
Open app.js and edit:
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "videome123";

For real security:
Do not keep password in JavaScript. Use PHP/Node/Laravel/WordPress/Blogger backend or Firebase/Supabase authentication.
