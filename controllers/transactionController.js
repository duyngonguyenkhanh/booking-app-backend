const Transaction = require("../models/transaction");

exports.getTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    //tìm tất cả các userID tương ứng
    const transactions = await Transaction.find({ userid: userId });
    //kiểm tra xem có dữ liệu hay không
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this user." });
    }
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
