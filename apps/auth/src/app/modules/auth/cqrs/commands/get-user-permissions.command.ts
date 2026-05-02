export class GetUserPermissionsCommand {
    constructor(
        public readonly userId: string,
        public readonly sid: string,
    ) {}
}
