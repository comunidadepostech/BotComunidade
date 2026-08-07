import { createCanvas, Image, loadImage } from '@napi-rs/canvas';
import type IImageProvider from '../../types/providers/images/imageProvider.interface';

export default class NapiCanvasAdapter implements IImageProvider {
    private background: Image | null = null;
    constructor() {}

    async generateWelcomeImage(memberName: string, memberAvatarURL: string, welcomeMessage: string): Promise<Buffer> {
        // Load the background image only once and cache it for future use
        if (!this.background) {
            this.background = await loadImage('./assets/wallpaper.png');
        }

        // Create a canvas and get its context
        const canvas = createCanvas(1401, 571);
        const context = canvas.getContext('2d');

        // Load the member's avatar image from the provided URL
        const response = await fetch(memberAvatarURL);
        const avatarBuffer = Buffer.from(await response.arrayBuffer());
        const avatar = await loadImage(avatarBuffer);

        // Draw the background and the avatar on the canvas
        context.drawImage(this.background, 0, 0, canvas.width, canvas.height);
        context.save();
        context.beginPath();
        context.arc(285, 285, 256, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(avatar, 29, 29, 512, 512);
        context.restore();

        // Draw the welcome text on the canvas
        context.font = '150px normalFont';
        context.fillStyle = '#ffffff';
        context.fillText(welcomeMessage, 512 + 100, (canvas.height - 150 + 150) / 2);
        context.fillText(`${memberName}`, 512 + 100, (canvas.height - 150 + 150) / 2 + 150);

        return Buffer.from(await canvas.encode('png'));
    }
}
