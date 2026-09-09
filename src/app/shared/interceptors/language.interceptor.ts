import { HttpRequest, HttpHandlerFn, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core'; // Для получения зависимостей
import { CookieService } from 'ngx-cookie-service'; // Импорт CookieService

/**
 * Функциональный HTTP-интерсептор для добавления заголовка UasLang.
 */
export const LanguageInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Получаем CookieService через инъекцию
  const cookieService = inject(CookieService);

  // Получаем значение UasLang из куки
  const uasLang = cookieService.get('UasLang');

  // Клонируем запрос и добавляем заголовок, если значение найдено
  const modifiedReq = req.clone({
    headers: req.headers.append('UasLang', uasLang)
  });

  // Передаем измененный запрос дальше по цепочке
  return next(modifiedReq);
};