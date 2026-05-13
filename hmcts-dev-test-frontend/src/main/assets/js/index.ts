import '../scss/main.scss';
import { initAll } from 'govuk-frontend';

import { initDeleteTaskDialog } from './delete-task-dialog';

document.addEventListener('DOMContentLoaded', () => {
  initAll();
  initDeleteTaskDialog();
});
