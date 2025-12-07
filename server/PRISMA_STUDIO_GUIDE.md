# Prisma Studio Setup Guide

## What is Prisma Studio?

Prisma Studio is a visual database browser that allows you to:
- View all data in your database tables
- Edit records directly
- Add new records
- Delete records
- Filter and search data
- See relationships between tables

## Starting Prisma Studio

### Option 1: Using npm script (Recommended)
```bash
cd server
npm run db:view
```

### Option 2: Using npx directly
```bash
cd server
npx prisma studio
```

### Option 3: Using ts-node (if needed)
```bash
cd server
npx prisma studio --schema=prisma/schema.prisma
```

## Accessing Prisma Studio

Once started, Prisma Studio will:
- Start a local server (usually on `http://localhost:5555`)
- Open automatically in your default browser
- If it doesn't open, navigate to `http://localhost:5555` manually

## Features

### Viewing Data
- Click on any table name in the left sidebar to view its records
- Use the search bar to filter records
- Click column headers to sort

### Editing Records
- Click on any field to edit it
- Changes are saved automatically
- Use the "Save" button to commit changes

### Adding Records
- Click the "+" button at the top of any table
- Fill in the required fields
- Click "Save" to create the record

### Deleting Records
- Click on a record to select it
- Click the trash icon to delete
- Confirm deletion

### Relationships
- Click on relationship fields (e.g., `shopId`, `productId`) to navigate to related records
- View related data in a popup or navigate to the related table

## Database Tables Available

After clearing the database, you'll see these tables:
- **User**: User accounts
- **Shop**: Shop information
- **Product**: Product catalog
- **Inventory**: Inventory records
- **InventoryLog**: Inventory change history
- **Sale**: Sales/orders
- **Forecast**: ML forecasting data
- **Campaign**: Marketing campaigns
- **Notification**: User notifications
- **Integration**: Platform integrations

## Troubleshooting

### Port Already in Use
If port 5555 is already in use:
```bash
npx prisma studio --port 5556
```

### Database Connection Error
- Ensure PostgreSQL is running
- Check `.env` file has correct `DATABASE_URL`
- Verify database exists

### Schema Out of Sync
If you see schema errors:
```bash
cd server
npx prisma generate
npx prisma db push
```

## Stopping Prisma Studio

- Press `Ctrl+C` in the terminal where it's running
- Or close the terminal window

## Tips

1. **Use filters** to find specific records quickly
2. **Check relationships** to understand data connections
3. **Be careful** when editing - changes are immediate
4. **Use it for debugging** to see what data is actually in the database
5. **Great for testing** - manually add test data without writing scripts

## Example Workflow

1. Start Prisma Studio: `npm run db:view`
2. Navigate to `User` table
3. Create a test user
4. Navigate to `Shop` table
5. Create a shop linked to the user
6. Navigate to `Product` table
7. Add products to the shop
8. After syncing from Shopee-Clone, view synced data here

