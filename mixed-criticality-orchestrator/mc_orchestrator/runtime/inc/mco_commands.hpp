#ifndef _COMMANDS_H
#define _COMMANDS_H

#include <string>
#include <memory>

// Abstract base class for all commands
class Command {
public:
    virtual bool Execute() const = 0;
    virtual ~Command() = default;
};

// Invoker class to invoke the command
class Invoker {
    std::unique_ptr<Command> command_;
public:
    void SetCommand(std::unique_ptr<Command> cmd) {
        command_ = std::move(cmd);
    }
    bool Invoke() {
        if (command_) {
            return command_->Execute();
        }
        return false;
    }
};

// Add other command classes as needed

#endif