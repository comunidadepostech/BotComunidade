export default interface ILinkedInService {
    sharePostOnLinkedin(imageUrl: string): Promise<string>
}