/* @flow */
/** @jsx node */

import { node, type ElementNode } from 'jsx-pragmatic/src';
import { LOGO_CLASS } from '@paypal/sdk-logos/src';

import { CLASS } from '../../constants';

function getComponentScript() : () => void {

    /* istanbul ignore next */
    return () => {

        const STYLE = {
            BLOCK:        'block',
            INLINE_BLOCK: 'inline-block',
            NONE:         'none',
            VISIBLE:      'visible',
            HIDDEN:       'hidden'
        };

        function loop(method : Function, delay : number, instances : number) {
            setTimeout(() => {
                method();
                instances -= 1;
                if (instances) {
                    loop(method, delay, instances);
                }
            }, delay);
        }

        function getElements(selector, parent) : $ReadOnlyArray<HTMLElement> {
            parent = parent || document;
            return Array.prototype.slice.call(parent.querySelectorAll(selector));
        }

        function showElement(el : HTMLElement, displayType : string = STYLE.INLINE_BLOCK) {
            el.style.display = displayType;
        }

        function hideElement(el : HTMLElement) {
            el.style.display = STYLE.NONE;
        }

        function makeElementVisible(el : HTMLElement) {
            el.style.visibility = STYLE.VISIBLE;
        }

        function makeElementInvisible(el : HTMLElement) {
            el.style.visibility = STYLE.HIDDEN;
        }

        function hasDimensions(el : HTMLElement) : boolean {
            const rect = el.getBoundingClientRect();
            return Boolean(rect.height && rect.width);
        }

        function isHidden(el : HTMLElement) : boolean {
            const computedStyle = window.getComputedStyle(el);
            return (!computedStyle || computedStyle.display === STYLE.NONE);
        }

        function displayedElementsHaveDimensions(elements : $ReadOnlyArray<HTMLElement>) : boolean {
            return elements.every(el => {
                return hasDimensions(el) || isHidden(el);
            });
        }

        function onDisplay(elements, method) {
            if (displayedElementsHaveDimensions(elements)) {
                method();
                return;
            }

            const interval = setInterval(() => {
                if (displayedElementsHaveDimensions(elements)) {
                    clearInterval(interval);
                    method();
                }
            }, 5);
        }

        function isOverflowing(el : HTMLElement) : boolean {

            if (el.offsetWidth < el.scrollWidth || el.offsetHeight < el.scrollHeight) {
                return true;
            }

            const parent = el.parentNode;

            if (!parent) {
                return false;
            }

            const e = el.getBoundingClientRect();
            // $FlowFixMe
            const p = parent.getBoundingClientRect();

            if (e.top < p.top || e.left < p.left || e.right > p.right || e.bottom > p.bottom) {
                return true;
            }

            if (e.left < 0 || e.top < 0 || (e.left + e.width) > window.innerWidth || (e.top + e.height) > window.innerHeight) {
                return true;
            }

            return false;
        }

        const images    = getElements('.{ CLASS.BUTTON } .{ LOGO_CLASS.LOGO }');
        const text      = getElements('.{ CLASS.BUTTON } .{ CLASS.TEXT }');
        const tagline   = getElements('.{ CLASS.TAGLINE }');
        const optionals = getElements('.{ CLASS.BUTTON }-label-credit .{ CLASS.BUTTON }-logo-paypal');

        function toggleOptionals() {

            if (tagline.some(isOverflowing)) {
                tagline.forEach(makeElementInvisible);
            } else {
                tagline.forEach(makeElementVisible);
            }

            text.forEach(el => showElement(el));
            optionals.forEach(el => showElement(el));

            if (images.some(isOverflowing) || text.some(isOverflowing)) {
                text.forEach(hideElement);
                optionals.forEach(hideElement);
                
            } else {
                text.forEach(makeElementVisible);
                optionals.forEach(el => showElement(el));
            }
        }

        toggleOptionals();

        onDisplay(images, () => {
            images.forEach(makeElementVisible);
            toggleOptionals();

            document.addEventListener('DOMContentLoaded', toggleOptionals);
            window.addEventListener('load', toggleOptionals);
            window.addEventListener('resize', toggleOptionals);
            loop(toggleOptionals, 10, 10);
        });
    };
}

type ScriptProps = {|
    nonce : ?string
|};

export function Script({ nonce } : ScriptProps) : ElementNode {
    let script = getComponentScript().toString();

    script = script.replace(/\{\s*CLASS\.([A-Z0-9_]+)\s*\}/g, (match, name) => {
        return CLASS[name];
    });

    script = script.replace(/\{\s*LOGO_CLASS\.([A-Z0-9_]+)\s*\}/g, (match, name) => {
        return LOGO_CLASS[name];
    });

    return (
        <script nonce={ nonce } innerHTML={ `(${ script })()` } />
    );
}