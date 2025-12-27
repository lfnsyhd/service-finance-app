# Finance App Server

Backend API for finance tracking application.

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Transactions (Protected)
- GET `/api/transactions` - Get all transactions
- GET `/api/transactions/:id` - Get single transaction
- POST `/api/transactions` - Create transaction
- PUT `/api/transactions/:id` - Update transaction
- DELETE `/api/transactions/:id` - Delete transaction
- GET `/api/transactions/summary/stats` - Get summary statistics
"# service-finance-app" 
# service-finance-app
