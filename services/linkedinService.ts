import type ILinkedInService from "../types/linkedinService.interface.ts";
import {env} from "../config/env.ts";

export default class LinkedinService implements ILinkedInService{
    async sharePostOnLinkedin(imageUrl: string): Promise<string> {
        const urlParams = new URLSearchParams({
            img: imageUrl,
        });

        const pageWithOgTags = `${env.LINKEDIN_SHARE_ROUTE}?${urlParams.toString()}`;

        const linkedInShareUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
        linkedInShareUrl.searchParams.set('url', pageWithOgTags);

        return linkedInShareUrl.toString();
    }
}