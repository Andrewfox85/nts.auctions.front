import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { inject } from '@angular/core'; // Для получения зависимостей
import { LoaderPanelService } from '@services'; // Ваш сервис лоадера

// --- Состояние для функционального интерсептора ---
// Эти переменные будут "глобальными" для данного интерсептора
let activeRequests: HttpRequest<unknown>[] = [];
let loaderTimer: ReturnType<typeof setTimeout> | undefined; // Тип для setTimeout

/**
 * Вспомогательная функция для удаления запроса из списка
 */
function removeRequest(req: HttpRequest<unknown>, loaderService: LoaderPanelService) {
  const index = activeRequests.indexOf(req);
  if (index >= 0) {
    activeRequests.splice(index, 1);
  }

  // Если нет активных запросов, выключаем лоадер и очищаем таймер
  if (activeRequests.length === 0) {
    if (loaderTimer) {
      clearTimeout(loaderTimer);
      loaderTimer = undefined;
    }
    loaderService.startLoader(false);
  }
}
// --- Конец состояния ---


/**
 * Функциональный HTTP-интерсептор для отображения лоадера.
 */
export const LoaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Получаем сервис лоадера через инъекцию
  const loaderService = inject(LoaderPanelService);

  // Очищаем предыдущий таймер, если он есть, перед новым запросом
  if (loaderTimer) {
    clearTimeout(loaderTimer);
    loaderTimer = undefined; // Сбрасываем таймер
  }

  // Запускаем таймер для отображения лоадера через 200 мс
  loaderTimer = setTimeout(() => loaderService.startLoader(true), 200);

  // Добавляем текущий запрос в список активных
  activeRequests.push(req);

  // Передаем запрос дальше по цепочке
  return next(req).pipe(
    tap({
      // При ошибке: очищаем все активные запросы и выключаем лоадер
      error: (_error) => {
        activeRequests.length = 0; // Очищаем весь массив при ошибке (как было в оригинале)
        if (loaderTimer) { // Убедимся, что таймер также очищен
          clearTimeout(loaderTimer);
          loaderTimer = undefined;
        }
        loaderService.startLoader(false);
      }
    }),
    // Когда запрос завершится (успешно или с ошибкой), удаляем его из списка
    finalize(() => {
      removeRequest(req, loaderService);
    })
  );
};