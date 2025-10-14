(async () => {
  try {
    const { 
      makeWASocket, 
      useMultiFileAuthState, 
      delay, 
      DisconnectReason,
      makeCacheableSignalKeyStore,
      Browsers,
      fetchLatestBaileysVersion
    } = await import("@whiskeysockets/baileys");

    const fs = await import('fs');
    const pino = (await import('pino')).default;

    const rl = (await import("readline")).createInterface({ 
      input: process.stdin, 
      output: process.stdout 
    });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    const reset = "\x1b[0m";
    const green = "\x1b[1;32m";
    const yellow = "\x1b[1;33m";
    const red = "\x1b[1;31m";

    // Logo
    const logo = `${green}
$$$$$$\   $$$$$$\  $$\      $$\ $$\      $$\ $$\     $$\ 
$$  __$$\ $$  __$$\ $$$\    $$$ |$$$\    $$$ |\$$\   $$  |
$$ /  \__|$$ /  $$ |$$$$\  $$$$ |$$$$\  $$$$ | \$$\ $$  / 
\$$$$$$\  \$$$$$$$ |$$\$$\$$ $$ |$$\$$\$$ $$ |  \$$$$  /  
 \____$$\  \____$$ |$$ \$$$  $$ |$$ \$$$  $$ |   \$$  /   
$$\   $$ |$$\   $$ |$$ |\$  /$$ |$$ |\$  /$$ |    $$ |    
\$$$$$$  |\$$$$$$  |$$ | \_/ $$ |$$ | \_/ $$ |    $$ |    
 \______/  \______/ \__|     \__|\__|     \__|    \__|
============================================
[~] Author  : Z1DD1 H3R3 
[~] GitHub  : Z1DD1-XD
[~] Tool    : Updated WhatsApp AutoMsg Sender
============================================`;

    const clearScreen = () => {
      console.clear();
      console.log(logo);
    };

    let targetNumber = null;
    let messages = null;
    let intervalTime = null;
    let haterName = null;
    let isConnected = false;

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    async function sendMessages(MznKing) {
      while (isConnected) {
        for (const message of messages) {
          if (!isConnected) break;
          
          try {
            const currentTime = new Date().toLocaleTimeString();
            const fullMessage = `${haterName} ${message}`;

            await MznKing.sendMessage(targetNumber + '@s.whatsapp.net', { 
              text: fullMessage 
            });

            console.log(`${green}Target Number => ${reset}${targetNumber}`);
            console.log(`${green}Time => ${reset}${currentTime}`);
            console.log(`${green}Message => ${reset}${fullMessage}`);
            console.log('    [ =============== Z1DD1 XD-R3X =============== ]');

            await delay(intervalTime * 1000);
          } catch (sendError) {
            console.log(`${yellow}Error sending message: ${sendError.message}. Retrying...${reset}`);
            await delay(5000);
          }
        }
      }
    }

    const connectToWhatsApp = async () => {
      try {
        const { version } = await fetchLatestBaileysVersion();
        
        const MznKing = makeWASocket({
          version,
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
          },
          printQRInTerminal: false,
          logger: pino({ level: "fatal" }).child({ level: "fatal" }),
          browser: Browsers.ubuntu('Chrome'),
          syncFullHistory: false,
          generateHighQualityLinkPreview: true,
          getMessage: async key => {
            return {}
          }
        });

        MznKing.ev.on('creds.update', saveCreds);

        if (!MznKing.authState.creds.registered) {
          clearScreen();
          const phoneNumber = await question(`${green}[+] Enter Your Phone Number (with country code) => ${reset}`);
          
          await delay(1500);
          
          const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
          const pairingCode = await MznKing.requestPairingCode(cleanNumber);
          
          clearScreen();
          console.log(`${green}[✓] Your Pairing Code Is => ${reset}${pairingCode}`);
          console.log(`${yellow}[!] Enter this code in WhatsApp: Settings → Linked Devices → Link a Device${reset}`);
          console.log(`${yellow}[!] Waiting for pairing...${reset}\n`);
        }

        MznKing.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect } = update;

          if (connection === "open") {
            clearScreen();
            console.log(`${green}[✓] Your WhatsApp Login Successful!${reset}\n`);
            isConnected = true;

            if (!targetNumber || !messages || !intervalTime || !haterName) {
              targetNumber = await question(`${green}[+] Enter Target Number (with country code) => ${reset}`);
              targetNumber = targetNumber.replace(/[^0-9]/g, "");
              
              const messageFilePath = await question(`${green}[+] Enter Message File Path => ${reset}`);
              
              if (!fs.existsSync(messageFilePath)) {
                console.log(`${red}[✗] Error: Message file not found!${reset}`);
                process.exit(1);
              }
              
              messages = fs.readFileSync(messageFilePath, 'utf-8')
                .split('\n')
                .filter(line => line.trim() !== '');
              
              if (messages.length === 0) {
                console.log(`${red}[✗] Error: Message file is empty!${reset}`);
                process.exit(1);
              }
              
              haterName = await question(`${green}[+] Enter Message Prefix => ${reset}`);
              intervalTime = await question(`${green}[+] Enter Message Delay (seconds) => ${reset}`);

              clearScreen();
              console.log(`${green}[✓] All Details Filled Correctly${reset}`);
              console.log(`${green}[✓] Starting Message Sending...${reset}`);
              console.log('    [ =============== S9MMY KING =============== ]\n');

              await sendMessages(MznKing);
            }
          }

          if (connection === "close") {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`${yellow}[!] Connection closed${reset}`);
            
            if (shouldReconnect) {
              console.log(`${yellow}[!] Reconnecting in 5 seconds...${reset}`);
              setTimeout(connectToWhatsApp, 5000);
            } else {
              console.log(`${red}[✗] Logged out. Please delete 'auth_info' folder and restart.${reset}`);
              process.exit(1);
            }
          }
        });

      } catch (error) {
        console.error(`${red}[✗] Connection Error: ${error.message}${reset}`);
        console.log(`${yellow}[!] Retrying in 10 seconds...${reset}`);
        setTimeout(connectToWhatsApp, 10000);
      }
    };

    clearScreen();
    console.log(`${green}[~] Initializing WhatsApp Connection...${reset}\n`);
    await connectToWhatsApp();

    process.on('uncaughtException', function (err) {
      let e = String(err);
      if (e.includes("Socket connection timeout") || 
          e.includes("rate-overlimit") || 
          e.includes("Connection Closed")) {
        console.log(`${yellow}[!] Network issue detected, reconnecting...${reset}`);
        return;
      }
      console.log(`${red}[✗] Caught exception: ${err}${reset}`);
    });

    process.on('SIGINT', () => {
      console.log(`\n${yellow}[!] Shutting down gracefully...${reset}`);
      isConnected = false;
      process.exit(0);
    });

  } catch (error) {
    console.error(`${red}[✗] Error importing modules: ${error.message}${reset}`);
    process.exit(1);
  }
})();
