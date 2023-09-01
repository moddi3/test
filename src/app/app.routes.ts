import { Route } from '@angular/router';
import { ExampleComponent } from 'src/app/example/example.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ExampleComponent,
    data: { revalidate: 100 },
  },
  {
    path: 'example',
    component: ExampleComponent,
    data: { revalidate: 100 },
  },
];
