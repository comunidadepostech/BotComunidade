export default interface ILinkedinService {
    sharePostOnLinkedin(imageUrl: string): Promise<string>
}