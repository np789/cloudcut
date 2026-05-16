import { describe, it, expect, beforeEach } from 'vitest';
import { CommandManager } from '@/state/commands/CommandManager';
import { Command } from '@/state/commands/CommandManager';
import { v4 as uuidv4 } from 'uuid';

function makeCommand(onExecute: () => void, onUndo: () => void): Command {
  return {
    id: uuidv4(),
    type: 'test',
    description: 'Test command',
    timestamp: Date.now(),
    execute: onExecute,
    undo: onUndo,
  };
}

describe('CommandManager', () => {
  beforeEach(() => {
    // Reset by undoing all commands
    while (CommandManager.canUndo()) CommandManager.undo();
  });

  it('executes a command', () => {
    let value = 0;
    const cmd = makeCommand(() => { value = 1; }, () => { value = 0; });
    CommandManager.execute(cmd);
    expect(value).toBe(1);
  });

  it('undoes a command', () => {
    let value = 0;
    const cmd = makeCommand(() => { value = 1; }, () => { value = 0; });
    CommandManager.execute(cmd);
    CommandManager.undo();
    expect(value).toBe(0);
  });

  it('redoes after undo', () => {
    let value = 0;
    const cmd = makeCommand(() => { value = 1; }, () => { value = 0; });
    CommandManager.execute(cmd);
    CommandManager.undo();
    CommandManager.redo();
    expect(value).toBe(1);
  });

  it('clears redo stack on new command', () => {
    let a = 0;
    const cmd1 = makeCommand(() => { a = 1; }, () => { a = 0; });
    const cmd2 = makeCommand(() => { a = 2; }, () => { a = 1; });
    CommandManager.execute(cmd1);
    CommandManager.undo();
    expect(CommandManager.canRedo()).toBe(true);
    CommandManager.execute(cmd2); // New command clears redo
    expect(CommandManager.canRedo()).toBe(false);
  });

  it('canUndo is false when stack is empty', () => {
    expect(CommandManager.canUndo()).toBe(false);
  });

  it('shows history in reverse order', () => {
    const cmd1 = makeCommand(() => {}, () => {});
    cmd1.description = 'First';
    const cmd2 = makeCommand(() => {}, () => {});
    cmd2.description = 'Second';
    CommandManager.execute(cmd1);
    CommandManager.execute(cmd2);
    const history = CommandManager.getHistory();
    expect(history[0].description).toBe('Second'); // Most recent first
  });
});
