import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommonService } from '@services';
import { ISessionState, ISessionStateConfig } from '../../views/homepage/interfaces';

export const sessionInfoResolver: ResolveFn<ISessionStateConfig | null> =
  (route: ActivatedRouteSnapshot, _: RouterStateSnapshot): Observable<ISessionStateConfig | null> => {
    const commonService = inject(CommonService);
    const router = inject(Router);
    const idSection = +route.queryParams['idSection'];
    const idSession = +route.queryParams['idSession'];

    const sessionKey = JSON.parse(localStorage.getItem('user') || '{}').token;

    if (isNaN(idSection) || isNaN(idSession)) {
      router.navigate(['/']);
      return of(null);
    }

    return commonService.GetSessionState(sessionKey, idSection, idSession).pipe(
      map((res: ISessionState) => {
        if (res && res.sessionStates && res.sessionStates.length > 0) {
          return res.sessionStates[0];
        } else {
          router.navigate(['/']);
          return null;
        }
      }),
      catchError((err) => {
        console.error('Resolver: Error loading session info from API:', err);
        router.navigate(['/error-page']);
        return of(null);
      })
    );
  };