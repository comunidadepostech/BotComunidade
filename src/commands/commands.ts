import { CreateClassCommand } from "./createclass.js";
import { PingCommand } from "./ping.js";
import { InviteCommand } from "./invite.js";
import { EchoCommand } from "./echo.js";
import { DisplayCommand } from "./display.js";
import { PollCommand } from "./poll.js";
import { ExtractCommand } from "./extract.js";
import { EventCommand } from "./event.js";
import { DisableCommand } from "./disable.js";
import { UpdateFlagCommand } from "./updateflag.js";
import { ViewFlagsCommand } from "./viewflags.js";

import { Bot } from "../bot.js";

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
    new ViewFlagsCommand(bot)
]