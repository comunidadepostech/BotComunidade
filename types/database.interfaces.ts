import type {RowDataPacket} from "mysql2/promise";

export interface IDatabaseWarningRepository {
    save(message_id: string, channel_id: string): Promise<void>;
    delete(): void;
    check(channel_id?: string): Promise<RowDataPacket[] | RowDataPacket | undefined>
}

export interface WarningMessageRow extends RowDataPacket {
    messageID: string;
    channlID: string;
}