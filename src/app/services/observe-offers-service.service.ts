import { Injectable } from '@angular/core';
import { getTranslateResultByCurrentLang } from '@helpers';
import {
  DemandService,
  TargetedService,
  WatchedAddRequest,
  WatchedDeleteRequest,
  DemandOffer,
  PopupSidebarService
} from '@services';
import { forkJoin, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WatchedBody, TargetedOffer } from './targeted-service/shared/interfaces/index';
import { User, PageCache } from '@classes';

interface dataFromSidebar {
  isWatched: boolean,
  idDemandOffer?: number,
  idOfferOffer?: number,
  directionId?: number
}
interface Context {
  user: User;
  sessionIds: sessionIds;
  cache: PageCache;
  isOpenedView: boolean;
  currentLang: string;
  popupSidebarService: PopupSidebarService;
  filterOffersWorker?: () => void;
  filterOffers?: () => void;
  filterDirectOffersWorker?: () => void;
  filterDirectOffers?: () => void;
  showToast: (msg: string) => void;
}

interface sessionIds {
  sectionId: number;
  sessionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ObserveOffersService {
  constructor(
    private demandService: DemandService,
    private targetedService: TargetedService
  ) {}

  public observeOffer(
    data: DemandOffer[] | TargetedOffer[] | dataFromSidebar[],
    context: Context,
    type: string
  ): Observable<void[]> {

    const isWorker: boolean = context.user?.IsWorker;
    const isWatched: boolean = data[0].isWatched;

    const requests = data.map((el) => {
      const idOffer: number = type === 'demand' ? el.idDemandOffer : el.idOffer;

      const baseFields = {
        idSection: context.sessionIds.sectionId,
        idSession: context.sessionIds.sessionId,
      };

      let body: WatchedAddRequest | WatchedDeleteRequest | WatchedBody;

      if (type === 'demand') {
        if (isWatched) {
          body = {
            ...baseFields,
            idDemandOffer: idOffer,
          };
        } else {
          body = {
            ...baseFields,
            idDemandOffer: idOffer,
            idDirection: el.directionId,
          };
        }
      } else {
        body = {
          ...baseFields,
          idOffer: idOffer,
        };
      }

      const apiMethod = this.getApiMethod(
        type,
        isWorker,
        isWatched,
        context.user?.token,
        body
      );

      return apiMethod.pipe(
        tap((res) => {
          this.handleToastAndSidebar(idOffer, isWatched, data.length, context);
        }),
        catchError((err) => of(null))
      );
    });

    return forkJoin(requests).pipe(
      tap(() => {
        data.forEach((el) => (el.isWatched = !isWatched));

        if (context.cache.filters.observed) {
          if (type === 'demand') {
            isWorker ? context.filterOffersWorker() : context.filterOffers();
          } else {
            isWorker
              ? context.filterDirectOffersWorker()
              : context.filterDirectOffers();
          }
        }
      })
    );
  }

  private getApiMethod(
    type: string,
    isWorker: boolean,
    isWatched: boolean,
    token: string,
    body: WatchedAddRequest | WatchedDeleteRequest | WatchedBody
  ): Observable<void> {
    if (type === 'demand') {
      if (isWorker) {
        return isWatched
          ? this.demandService.watchedDeleteWorker(token, body as WatchedDeleteRequest)
          : this.demandService.watchedAddWorker(token, body as WatchedAddRequest);
      }
      return isWatched
        ? this.demandService.watchedDelete(token, body as WatchedDeleteRequest)
        : this.demandService.watchedAdd(token, body as WatchedAddRequest);
    } else {
      if (isWorker) {
        return isWatched
          ? this.targetedService.directWatchedDeleteWorker(token, body as WatchedBody)
          : this.targetedService.directWatchedAddWorker(token, body as WatchedBody);
      }
      return isWatched
        ? this.targetedService.directWatchedDelete(token, body as WatchedBody)
        : this.targetedService.directWatchedAdd(token, body as WatchedBody);
    }
  }

  private handleToastAndSidebar(
    idOffer: number,
    isWatched: boolean,
    totalLength: number,
    context: Context
  ): void {
    const actionKey: string = isWatched ? 'deleteToObservedMess' : 'addToObservedMess';
    const suffix: string = totalLength > 1 ? 'Plural' : '';

    const message: string = getTranslateResultByCurrentLang(
      context.currentLang,
      `trading.offersTable.${actionKey}${suffix}`
    );

    context.showToast(message);

    if (context.isOpenedView) {
      context.popupSidebarService.updateWatched([
        idOffer,
        isWatched ? 'delete' : 'add',
      ]);
    }
  }
}
