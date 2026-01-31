import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  isOpen = input.required<boolean>();
  title = input<string>('');

  onClose = output<void>();

  @HostListener('document:keydown.escape')
  onEscKeydown() {
    if (this.isOpen()) {
      this.close();
    }
  }

  close() {
    this.onClose.emit();
  }

  onBackdropClick(event: MouseEvent) {
    // Only close if the backdrop itself was clicked, not the modal content
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.close();
    }
  }
}
