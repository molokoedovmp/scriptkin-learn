const adminUrl = process.env.SANDBOX_ADMIN_DATABASE_URL?.trim();
const playerPassword = process.env.SANDBOX_PLAYER_PASSWORD?.trim();

if (!adminUrl || !playerPassword) {
  throw new Error(
    "Для подключения песочницы нужны SANDBOX_ADMIN_DATABASE_URL и SANDBOX_PLAYER_PASSWORD."
  );
}

const playerUrl = new URL(adminUrl);
playerUrl.username = "sqlquest_player";
playerUrl.password = playerPassword;

process.stdout.write(playerUrl.toString());
