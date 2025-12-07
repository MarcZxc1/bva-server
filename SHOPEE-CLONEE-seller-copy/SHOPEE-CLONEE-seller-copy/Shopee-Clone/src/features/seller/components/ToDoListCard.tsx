import './SellerDashboard.css';

const ToDoListCard = () => {
  return (
    <div className="dashboard-card todo-card">
      <div className="card-header">
        <h3 className="card-title">To Do List</h3>
      </div>
      <div className="todo-list">
        <div className="todo-item">
          <div className="todo-number blue">0</div>
          <div className="todo-label">To-Process Shipment</div>
        </div>
        <div className="todo-item">
          <div className="todo-number blue">0</div>
          <div className="todo-label">Processed Shipment</div>
        </div>
        <div className="todo-item">
          <div className="todo-number blue">0</div>
          <div className="todo-label">Return/Refund/Cancel</div>
        </div>
        <div className="todo-item">
          <div className="todo-number blue">1</div>
          <div className="todo-label">Banned / Deboosted Products</div>
        </div>
      </div>
    </div>
  );
};

export default ToDoListCard;

