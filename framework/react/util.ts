import type { ComponentType } from 'https://esm.sh/react'
import util, { reModuleExt } from '../../shared/util.ts'
import { E400MissingDefaultExportAsComponent } from './error.ts'

const symbolFor = typeof Symbol === 'function' && Symbol.for
const REACT_FORWARD_REF_TYPE = symbolFor ? Symbol.for('react.forward_ref') : 0xead0
const REACT_MEMO_TYPE = symbolFor ? Symbol.for('react.memo') : 0xead3

export interface PageProps {
    Page: ComponentType<any> | null
    pageProps: Partial<PageProps> & { name?: string }
}

export function isLikelyReactComponent(type: any): Boolean {
    switch (typeof type) {
        case 'function':
            if (type.prototype != null) {
                if (type.prototype.isReactComponent) {
                    return true
                }
                const ownNames = Object.getOwnPropertyNames(type.prototype);
                if (ownNames.length > 1 || ownNames[0] !== 'constructor') {
                    return false
                }
            }
            const name = type.name || type.displayName
            return typeof name === 'string' && /^[A-Z]/.test(name)
        case 'object':
            if (type != null) {
                switch (type.$$typeof) {
                    case REACT_FORWARD_REF_TYPE:
                    case REACT_MEMO_TYPE:
                        return true
                    default:
                        return false
                }
            }
            return false
        default:
            return false
    }
}

export function createPageProps(componentTree: { url: string, Component?: ComponentType<any> }[]): PageProps {
    const pageProps: PageProps = {
        Page: null,
        pageProps: {}
    }
    if (componentTree.length > 0) {
        Object.assign(pageProps, _createPagePropsSegment(componentTree[0]))
    }
    if (componentTree.length > 1) {
        componentTree.slice(1).reduce((p, seg) => {
            const c = _createPagePropsSegment(seg)
            p.pageProps = c
            return c
        }, pageProps)
    }
    return pageProps
}

function _createPagePropsSegment(seg: { url: string, Component?: ComponentType<any> }): PageProps {
    const pageProps: PageProps = {
        Page: null,
        pageProps: {}
    }
    if (seg.Component) {
        if (isLikelyReactComponent(seg.Component)) {
            pageProps.Page = seg.Component
        } else {
            pageProps.Page = E400MissingDefaultExportAsComponent
            pageProps.pageProps = { name: 'Page: ' + util.trimPrefix(seg.url, '/pages').replace(reModuleExt, '') }
        }
    }
    return pageProps
}
