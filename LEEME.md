# Tienda Ñanñis — página del smartwatch VP29

Página de lanzamiento del smartwatch VP29, hecha con HTML, CSS y JavaScript (sin instalar nada).

**Enlace público:** https://andrel2000.github.io/nannis-vp29/ (GitHub Pages, repositorio https://github.com/andrel2000/nannis-vp29).

Para publicar cambios: guarda los archivos y ejecuta en esta carpeta `git add -A`, después `git commit -m "tu mensaje"` y al final `git push`. GitHub Pages actualiza el enlace en uno o dos minutos.

## Verla en tu computadora

1. Abre una terminal en esta carpeta.
2. Ejecuta `node servidor-local.mjs`
3. Abre http://localhost:5500 en el navegador.

Hace falta el servidor (no abrir `index.html` con doble clic) porque el recorrido 3D se carga como módulo.

## Qué hay en la página

| Sección | Qué muestra |
| --- | --- |
| Portada | El reloj grande con "VP29" detrás, título, descripción, **Pedir el VP29** y 4 cifras (2,29″, 180°, 1380 mAh, IP67) |
| Video 3D (`#recorrido-3d`) | Tu video 3D en 4 escenas cortas que avanzan con el scroll: cámara (el 180° cuenta mientras gira), chip SIM, apps y sensores. Los botones de abajo saltan a cada escena |
| Pantalla (`#pantalla`) | Foto grande de las apps, WhatsApp y la esfera, resolución, RAM, procesador e íconos de apps |
| Cámara (`#camara`) | El render con la cámara afuera y el primer plano real de la lente |
| Chip SIM (`#sim`) | La foto marca dónde va el chip, los 3 pasos y la conectividad |
| Sensores (`#sensores`) | La parte de atrás y la luz verde del sensor, batería e IP67 |
| Correas (`#correas`) | Blanco o negro con transición; la elección pasa al pedido |
| Ficha (`#ficha`) | Especificaciones del fabricante agrupadas |
| Pedido (`#pedido`) | Formulario con el color sincronizado y "Precio a consultar": al enviarlo se abre WhatsApp con el pedido escrito |

## Pedidos por WhatsApp

Los pedidos llegan al WhatsApp **+51 963 566 440**. El cliente elige color, nombre, cantidad y ciudad, toca «Pedir el VP29» y se abre su WhatsApp con el mensaje listo para enviar. El enlace «¿Dudas? Escríbenos por WhatsApp» va al mismo número.

Para cambiar el número, en `index.html` busca `data-whatsapp="51963566440"` y `action="https://wa.me/51963566440"` y escribe el nuevo, con el código de país y sin `+` ni espacios.

## Lo que se responde por WhatsApp

El precio, la versión de memoria, el envío y la garantía no van en la página: se los dices a cada cliente por WhatsApp. La página muestra «Precio a consultar».

## Carpetas

- `index.html` — la página. `css/nannis.css` — el estilo. `js/nannis.js` — revelados, contadores y el selector de correa.
- `media/v2/` — las fotos ajustadas al grafito y al blanco roto, el recorte del reloj de la portada y los fotogramas del recorrido 3D (`film/d` escritorio, `film/m` celular).
- `media/logo/` — tu logo y los íconos de la pestaña. `media/film/vp29-3d.mp4` — el video original (se ve si el visitante tiene el movimiento reducido).
- `assets/` — el kit de diseño y la escena `assets/scenes/film-scrub/`, que mueve tu video con el scroll.
- `servidor-local.mjs` — servidor para verla en tu computadora.

El archivo `.gitignore` decide qué se sube: solo lo que la página usa (no se suben las pruebas, capturas ni las fotos de la versión anterior).
