const sendLogToChat = async (token, chat_id, description, data) => {
  await fetch(
    `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${data}
    `,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }
  );
};

export const btqFinance = async (req, res) => {
  try {
    const paymentData = req.body;

    console.log("Payment webhook received:", paymentData);

    let message;

    switch (paymentData.status) {
      case "success":
        message = `✅ Платеж успешен! Payment ID: ${paymentData.paymentId}, Client ID: ${paymentData.externalClientId}`;
        break;
      case "failure":
        message = `❌ Платеж не прошел! Payment ID: ${paymentData.paymentId}, Client ID: ${paymentData.externalClientId}`;
        break;
      case "pending":
        message = `⏳ Платеж ожидает подтверждения. Payment ID: ${paymentData.paymentId}, Client ID: ${paymentData.externalClientId}`;
        break;
      default:
        message = `ℹ️ Новый статус платежа: ${paymentData.status}. Payment ID: ${paymentData.paymentId}, Client ID: ${paymentData.externalClientId}`;
    }

    await sendLogToChat(
      process.env.BOT_LOG_TOKEN,
      "-1002933938790",
      "Payment Update",
      message
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message, type: "error" });
  }
};
