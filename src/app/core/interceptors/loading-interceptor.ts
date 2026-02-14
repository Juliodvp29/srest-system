import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Loading } from '@app/core/services/loading';
import { finalize } from 'rxjs/operators';

export const SKIP_LOADING = new HttpContextToken(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(Loading);

  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }

  //activate the charging state
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    }),
  );
};
