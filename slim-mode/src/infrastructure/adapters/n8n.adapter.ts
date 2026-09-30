import type N8NMessageSaveDTO from '../../types/dtos/n8nMessageSave.dto';
import type N8NPollSaveDTO from '../../types/dtos/n8nPollSave.dto';
import type { N8NSaveMembersByRoleDTO } from '../../types/dtos/saveMembersByRole.dto';
import { NetworkError } from '../../types/errors.types';
import type IN8NMessageProvider from '../../types/providers/n8n/messageProvider.interface';
import type ILoggerService from '../../types/services/loggerService.interface';

export default class N8nAdapter implements IN8NMessageProvider {
    constructor(
        private logger: ILoggerService,
        private config: { endpoint: string; token: string },
    ) {}

    async savePoll(dto: N8NPollSaveDTO): Promise<void> {
        await fetch(`${this.config.endpoint}/salvarEnquete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.token}`,
            },
            body: JSON.stringify(dto),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new NetworkError(`${this.config.endpoint}/salvarEnquete`, this.savePoll.name, response.status);
                }
                return response.json();
            })
            .then(() => {
                this.logger.http('Poll sent to n8n', { payload: dto });
            })
            .catch((error) => {
                this.logger.error('Failed to send poll to n8n', { error, payload: dto });
            });
    }

    async saveMessage(dto: N8NMessageSaveDTO): Promise<void> {
        await fetch(`${this.config.endpoint}/salvarInteracao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.token}`,
            },
            body: JSON.stringify(dto),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new NetworkError(
                        `${this.config.endpoint}/salvarInteracao`,
                        this.saveMessage.name,
                        response.status,
                    );
                }
                return response.json();
            })
            .then(() => {
                this.logger.http('Message sent to n8n', { payload: dto });
            })
            .catch((error) => {
                this.logger.error('Failed to send message to n8n', { error, payload: dto });
            });
    }

    async saveOnlineMembers(total: number): Promise<void> {
        await fetch(`${this.config.endpoint}/salvarMembrosOnline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.token}`,
            },
            body: JSON.stringify({ count: total }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new NetworkError(
                        `${this.config.endpoint}/salvarMembrosOnline`,
                        this.saveMessage.name,
                        response.status,
                    );
                }
                return response.json();
            })
            .then(() => {
                this.logger.http('Online members data sent to n8n', { payload: { count: total } });
            })
            .catch((error) => {
                this.logger.error('Failed to send online members data to n8n', { error, payload: { count: total } });
            });
    }

    async saveMembersByRole(dto: N8NSaveMembersByRoleDTO): Promise<void> {
        await fetch(`${this.config.endpoint}/salvarMembros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.token}`,
            },
            body: JSON.stringify(dto),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new NetworkError(`${this.config.endpoint}/salvarMembros`, this.saveMessage.name, response.status);
                }
                return response.json();
            })
            .then(() => {
                this.logger.http('Members count data sent to n8n', { payload: dto });
            })
            .catch((error) => {
                this.logger.error('Failed to send members count data to n8n', { error, payload: dto });
            });
    }
}
