import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DoubleCounterAuctionStore } from './store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-double-counter-auction',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './double-counter-auction.component.html',
  styleUrl: './double-counter-auction.component.scss',
  providers: [DoubleCounterAuctionStore],
})
export class DoubleCounterAuctionComponent {
  private readonly store = inject(DoubleCounterAuctionStore);
}
