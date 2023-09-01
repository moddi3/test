import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  makeStateKey,
  signal,
  TransferState,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent implements OnInit {
  catImage = signal('');
  time = signal('');
  catImageStateKey = makeStateKey<string>('catImage');
  timeStateKey = makeStateKey<string>('time');


  http = inject(HttpClient);
  platformId = inject(PLATFORM_ID);
  transferState: TransferState = inject(TransferState);
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.catImage.set(this.transferState.get(this.catImageStateKey, ''));
      this.time.set(this.transferState.get(this.timeStateKey, new Date().toString()));
      return;
    }

    this.http
      // .get('https://cat-fact.herokuapp.com/facts')
      .get('https://api.fisenko.net/v1/quotes/en')
      .subscribe((res: any) => {
        console.log('making request');
        console.log('res length', res.length);
        const factNumber = Math.floor(Math.random() * res.length);
        console.log('factNumber', factNumber);
        this.transferState.set(this.catImageStateKey, res[factNumber].text);
        this.transferState.set(this.timeStateKey, new Date().toString());
      });
  }

  invalidate() {
    this.http
      .post('/api/invalidate', {
        token: '123',
        urlsToInvalidate: ['/example'],
      })
      .subscribe((res) => {
        console.log('invalidate', res);
      });
  }
}
