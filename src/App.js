import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem("transactions");
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "give",
    date: "",
    category: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [sortType, setSortType] = useState("date");

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    if (formData.description && formData.amount) {
      const newTransaction = {
        ...formData,
        id: editId || Date.now(),
        date: editId ? formData.date : new Date().toISOString(),
      };

      if (editId) {
        setTransactions(transactions.map((tx) => (tx.id === editId ? newTransaction : tx)));
        setEditId(null);
      } else {
        setTransactions([...transactions, newTransaction]);
      }

      setFormData({
        description: "",
        amount: "",
        type: "give",
        date: "",
        category: "",
        notes: "",
      });
    }
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((tx) => tx.id !== id));
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const startEditTransaction = (transaction) => {
    setFormData(transaction);
    setEditId(transaction.id);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add a title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CashCook Transactions Report", 105, 15, { align: "center" });

    // Add a subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 25, { align: "center" });

    // Create a table with headers
    const headers = [["Type", "Description", "Amount (¹)", "Category", "Notes", "Date"]];
    const data = transactions.map((tx) => [
      tx.type.toUpperCase(),
      tx.description,
      `¹${tx.amount}`,
      tx.category,
      tx.notes,
      new Date(tx.date).toLocaleString(),
    ]);

    // Generate a styled table
    doc.autoTable({
      head: headers,
      body: data,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [0, 123, 255] },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Save the PDF
    doc.save("transactions.pdf");
  };

  const calculateTotals = () => {
    const totalGive = transactions
      .filter((tx) => tx.type === "give")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalTake = transactions
      .filter((tx) => tx.type === "take")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    return { totalGive, totalTake };
  };

  const sortTransactions = (type) => {
    let sorted = [];
    if (type === "amount") {
      sorted = [...transactions].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    } else if (type === "type") {
      sorted = [...transactions].sort((a, b) => a.type.localeCompare(b.type));
    } else if (type === "category") {
      sorted = [...transactions].sort((a, b) => a.category.localeCompare(b.category));
    } else {
      sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    setSortType(type);
    setTransactions(sorted);
  };

  const { totalGive, totalTake } = calculateTotals();

  const filteredTransactions = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(search.toLowerCase())
  );

  const toKD = (amount) => (amount / 279.15100).toFixed(2);
  const toUSD = (amount) => (amount / 86.20).toFixed(2);

  return (
    <div className="app">
      <h1>CashCook</h1>

      {/* Form Section */}
      <div className="form">
        <input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="give">Give</option>
          <option value="take">Take</option>
        </select>
        <select
          value={formData.category || ""}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Rent">Rent</option>
          <option value="Travel">Travel</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
        <input
          type="text"
          placeholder="Notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
        <button onClick={addTransaction}>{editId ? "Update" : "Add"}</button>
      </div>

      {/* Search and Sorting */}
      <input
        type="text"
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />
      <div className="sort-options">
        <button onClick={() => sortTransactions("date")} className={sortType === "date" ? "active" : ""}>
          Sort by Date
        </button>
        <button onClick={() => sortTransactions("amount")} className={sortType === "amount" ? "active" : ""}>
          Sort by Amount
        </button>
        <button onClick={() => sortTransactions("type")} className={sortType === "type" ? "active" : ""}>
          Sort by Type
        </button>
        <button onClick={() => sortTransactions("category")} className={sortType === "category" ? "active" : ""}>
          Sort by Category
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions">
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className={`transaction ${tx.type}`}>
            <span>{tx.description}</span>
            <span>¹{tx.amount}</span>
            <span>{tx.category}</span>
            <span>{tx.notes}</span>
            <span>{new Date(tx.date).toLocaleString()}</span>
            <button onClick={() => startEditTransaction(tx)}>Edit</button>
            <button onClick={() => deleteTransaction(tx.id)}>X</button>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="totals">
        <h3>Total Give: ¹{totalGive} | KD {toKD(totalGive)} | $ {toUSD(totalGive)}</h3>
        <h3>Total Take: ¹{totalTake} | KD {toKD(totalTake)} | $ {toUSD(totalTake)}</h3>
      </div>

      {/* PDF and Clear All */}
      <div className="action-buttons">
        <button onClick={generatePDF} className="pdf-button">Download PDF</button>
        <button onClick={clearTransactions} className="clear-button">Clear All</button>
      </div>
    </div>
  );
}

export default App;
