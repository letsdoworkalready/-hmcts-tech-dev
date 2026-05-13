// Delete confirmation is handled via inline onclick attributes on each Delete button.
// The dialog backdrop click is wired here as progressive enhancement.
export function initDeleteTaskDialog(): void {
  const dialog = document.getElementById('delete-task-dialog') as HTMLDialogElement | null;
  if (!dialog) return;

  dialog.addEventListener('click', (e: MouseEvent) => {
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      dialog.close();
    }
  });
}
