import CreateClassCommand from "./createclass.ts";
import PingCommand from "./ping.ts";
import InviteCommand from "./invite.ts";
import EchoCommand from "./echo.ts";
import DisplayCommand from "./display.ts";
import PollCommand from "./poll.ts";
import ExtractCommand from "./extract.ts";
import EventCommand from "./event.ts";
import DisableCommand from "./disable.ts";
import UpdateFlagCommand from "./updateflag.ts";
import ViewFlagsCommand from "./viewflags.ts";
import ExecCommand from "./exec.ts";
import EndPollCommand from "./endpoll.ts";

import Bot from "../bot.ts";

export const commands: Function = (bot: Bot): Array<Object> => [
    new CreateClassCommand(bot),
    new PingCommand(),
    new InviteCommand(bot),
    new EchoCommand(bot),
    new DisplayCommand(bot),
    new PollCommand(),
    new ExtractCommand(),
    new EventCommand(),
    new DisableCommand(),
    new UpdateFlagCommand(bot),
    new ViewFlagsCommand(bot),
    new ExecCommand(bot),
    new EndPollCommand(bot)
]