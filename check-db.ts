import AppDataSource from "./src/db/data-source";
import { EscrowTransaction } from "./src/db/entity/EscrowTransaction.entity";

async function checkEscrow() {
    try {
        await AppDataSource.initialize();
        console.log("DB Initialized");
        const escrow = await EscrowTransaction.findOne({ where: { id: 1 } });
        console.log("Escrow 1:", JSON.stringify(escrow, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkEscrow();
