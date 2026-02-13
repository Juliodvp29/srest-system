import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-user-manual',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-manual.html',
    styleUrl: './user-manual.css',
})
export class UserManual {
    scrollTo(elementId: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
