/**
 * Utilidad para enviar notificaciones a Telegram
 */
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Notifications] Telegram Bot Token/ChatID no configurado.");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Notifications] Error enviando a Telegram:", errorData);
    }
  } catch (error) {
    console.error("[Notifications] Error de red enviando a Telegram:", error);
  }
}
