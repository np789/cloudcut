import { useState, useEffect } from 'react';
import { CommandManager, Command } from '@/state/commands/CommandManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export default function UndoHistory() {
  const [history, setHistory] = useState<Command[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const update = () => {
      setHistory(CommandManager.getHistory());
      setCanUndo(CommandManager.canUndo());
      setCanRedo(CommandManager.canRedo());
    };
    update();
    return CommandManager.subscribe(update);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex gap-1">
        <Button
          size="sm" variant="outline"
          disabled={!canUndo}
          onClick={() => CommandManager.undo()}
          className="flex-1 h-6 text-xs"
        >
          ↩ Undo
        </Button>
        <Button
          size="sm" variant="outline"
          disabled={!canRedo}
          onClick={() => CommandManager.redo()}
          className="flex-1 h-6 text-xs"
        >
          ↪ Redo
        </Button>
      </div>
      <ScrollArea className="h-32">
        <div className="space-y-0.5">
          {history.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`text-[10px] px-2 py-1 rounded truncate ${
                i === 0 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
              }`}
            >
              {cmd.description}
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-[10px] text-muted-foreground px-2">No history</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
