import dotenv from "dotenv";
import crypto from "crypto";
import vault from "node-vault";

dotenv.config();

const encryptionSecretPath = process.env.VAULT_ENCRYPTION_PATH as string;
const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

export const generateAndSaveKeyPair = async () => {
  try {
    const serverECDH = crypto.createECDH("secp256k1");
    serverECDH.generateKeys();
    const privateKey = serverECDH.getPrivateKey();
    const publicKey = serverECDH.getPublicKey();
    await writeToVault(encryptionSecretPath, {
      SERVER_PRIVATE_KEY: Buffer.from(privateKey).toString("hex"),
      SERVER_PUBLIC_KEY: Buffer.from(publicKey).toString("hex"),
    });

    console.log(
      `-------------------------- [${new Date()}] Key pair generated and saved to Vault. -----------------`
    );
  } catch (error) {
    console.error("Error generating and saving key pair:", error);
  }
};

const readFromVault = async (path: string) => {
  const response = await vaultClient.read(path);
  return response.data.data || {};
};

const writeToVault = async (path: string, data: Record<string, string>) => {
  await vaultClient.write(path, { data });
};

export const getPublicKey = async () => {
  const keys = await readFromVault(encryptionSecretPath);
  return keys.SERVER_PUBLIC_KEY;
};

export const getPrivateKey = async () => {
  const keys = await readFromVault(encryptionSecretPath);
  return keys.SERVER_PRIVATE_KEY;
};


