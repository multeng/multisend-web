import { useRef, type ReactNode } from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import styles from './Editor.module.css';

export function EditorDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const focus = useRef({
    trigger: document.activeElement,
    fallback: document.activeElement
      ?.closest('[data-recipient-editor]')
      ?.querySelector('[data-editor-add]'),
  });
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content
        className={styles.dialog}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = focus.current.trigger?.isConnected
            ? focus.current.trigger
            : focus.current.fallback;
          if (target instanceof HTMLElement) target.focus();
        }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>
          Подготовка списка Testnet. Средства не отправляются.
        </Dialog.Description>
        {children}
        <Button variant="soft" className={styles.close} onClick={onClose}>
          Закрыть
        </Button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
