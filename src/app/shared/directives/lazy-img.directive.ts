import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appLazyImg]',
  standalone: true,
})
export class LazyImgDirective implements OnInit {
  @Input() appLazyImg: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.unobserve(this.el.nativeElement);
          }
        });
      });

      observer.observe(this.el.nativeElement);
    } else {
      this.loadImage();
    }
  }

  private loadImage() {
    const img = this.el.nativeElement;
    img.src = this.appLazyImg;
  }
}
