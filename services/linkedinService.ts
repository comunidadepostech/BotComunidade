import ILinkedinService from "../types/linkedinService.interface.ts";

export default class LinkedinService implements ILinkedinService{
    sharePostOnLinkedin(imageUrl: string): string {
        const urlParams = new URLSearchParams({
            img: imageUrl,
        });

        const pageWithOgTags = `${process.env.LINKEDIN_SHARE_ROUTE}?${urlParams.toString()}`;

        const linkedInShareUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
        linkedInShareUrl.searchParams.set('url', pageWithOgTags);

        return linkedInShareUrl.toString();
    }
}