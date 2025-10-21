# 🍽️ DineFlow-QR

**DineFlow-QR** is a QR-based smart food ordering system for restaurants.  
Customers simply scan a QR code placed on their table to browse the digital menu, add items to their cart, and confirm their order — all without installing any app. Once confirmed, the order is sent directly to the restaurant counter (with table and order number) for preparation and billing.

---

## 🚀 Features

- 📱 **QR Code Ordering** — Each table has a unique QR code linking to its digital menu session.  
- 🧾 **Interactive Menu** — Displays all food categories, prices, and descriptions from MongoDB.  
- 🛒 **Smart Cart System** — Customers can add, remove, and confirm orders.  
- 🧍‍♂️ **Table & Order Tracking** — Every order is tied to a specific table and auto-generated order ID.  
- 💬 **Counter Dashboard** — Staff view all incoming orders with real-time updates.  
- 💵 **Easy Payment Flow** — Customers show their order number at the counter to pay.  
- ☁️ **Cloud-Based** — Works without requiring users to connect to restaurant Wi-Fi.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Trae (visual code generation) with HTML, CSS, JavaScript |
| **Backend** | Node.js + Express |
| **Database** | MongoDB Atlas |
| **Deployment** | Render / Vercel / Trae Cloud |
| **QR Generation** | `qrcode` npm package |
| **Real-time Updates** | Socket.io |
| **Environment Config** | dotenv |

---

## 🗂️ Project Structure

DineFlow-QR/
├── models/
│ └── MenuItem.js
├── seed/
│ └── seedMenu.js
├── public/
│ └── qr/ # QR images per table
├── src/
│ ├── routes/
│ │ ├── menu.js
│ │ ├── order.js
│ │ └── table.js
│ ├── controllers/
│ ├── app.js
│ └── socket.js
├── menu.json
├── package.json
├── .env.example
└── README.md

yaml
Copy code

---

## ⚙️ Setup Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/DineFlow-QR.git
cd DineFlow-QR
2️⃣ Install Dependencies
bash
Copy code
npm install
3️⃣ Configure Environment Variables
Create a .env file in the root directory:

env
Copy code
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/restaurant
🍴 Import Menu Data
Option A — Quick Import (mongoimport)
bash
Copy code
mongoimport --uri "$MONGO_URI" --collection menuitems --file menu.json --jsonArray
Option B — Using Node Seeder (recommended)
bash
Copy code
npm run seed:menu
The seed script reads menu.json and inserts items into the menuitems collection.

▶️ Run the App
bash
Copy code
npm start
Then open in browser:

arduino
Copy code
http://localhost:5000
Scan the QR code from /public/qr/table1.png or a generated table QR.

🧾 API Endpoints Overview
Endpoint	Method	Description
/api/menu	GET	Fetch all menu items
/api/order	POST	Create new order
/api/order/:id	GET	Get order details
/api/table/:id/orders	GET	View table’s active orders

🖼️ QR System Setup (Real Restaurant Use)
Generate a unique QR for each table linking to:

sql
Copy code
https://dineflow.app/order?table=1
Print and place QR on each table.

When scanned, the system automatically identifies the table number.

Orders placed will appear at the counter dashboard tagged with table number and order ID.

☁️ Deployment
You can deploy DineFlow-QR using:

Trae Cloud

Render

Vercel (frontend only) + Render (backend)

MongoDB Atlas for database hosting

Example deploy commands:

bash
Copy code
npm run build
npm start
📦 Scripts
Script	Description
npm start	Run server
npm run seed:menu	Import menu items from menu.json
npm run dev	Run app in development mode with nodemon

🧠 Future Enhancements
Online payment gateway (Stripe / FPX)

Order status tracking (Preparing → Ready)

Multi-restaurant support

Admin dashboard for editing menus

Daily sales report generation

👨‍💻 Author
Shadman Sakib Sadvi
Computer Science (Cybersecurity Major) — Taylor’s University
📍 Malaysia
💼 Project built with Trae, Node.js, and MongoDB

📄 License
This project is open-source under the MIT License.

yaml
Copy code

---

Would you like me to make a **README version optimized for Trae’s documentation panel** (shorter and formatted for display inside the Trae app)?  
That one includes only setup, tech stack, and deployment instructions, perfect for internal devs or collaborators.







