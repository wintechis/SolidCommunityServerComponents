import { RepresentationMetadata } from '../../../../../src/http/representation/RepresentationMetadata';
import type { AccountIdRoute } from '../../../../../src/identity/interaction/account/AccountIdRoute';
import { ACCOUNT_SETTINGS_REMEMBER_LOGIN,
  AccountStore } from '../../../../../src/identity/interaction/account/util/AccountStore';
import { CookieStore } from '../../../../../src/identity/interaction/account/util/CookieStore';
import type { JsonRepresentation } from '../../../../../src/identity/interaction/InteractionUtil';
import type { JsonInteractionHandlerInput } from '../../../../../src/identity/interaction/JsonInteractionHandler';
import type { LoginOutputType } from '../../../../../src/identity/interaction/login/ResolveLoginHandler';
import {
  ResolveLoginHandler,
} from '../../../../../src/identity/interaction/login/ResolveLoginHandler';
import { CONTENT_TYPE, CONTENT_TYPE_TERM, SOLID_HTTP } from '../../../../../src/util/Vocabularies';

const accountId = 'accountId';
let output: JsonRepresentation<LoginOutputType>;
class DummyLoginHandler extends ResolveLoginHandler {
  public constructor(accountStore: AccountStore, cookieStore: CookieStore, accountRoute: AccountIdRoute) {
    super(accountStore, cookieStore, accountRoute);
  }

  public async login(): Promise<JsonRepresentation<LoginOutputType>> {
    return output;
  }
}

describe('A ResolveLoginHandler', (): void => {
  const cookie = 'cookie';
  let metadata: RepresentationMetadata;
  let input: JsonInteractionHandlerInput;
  let accountStore: jest.Mocked<AccountStore>;
  let cookieStore: jest.Mocked<CookieStore>;
  let accountRoute: jest.Mocked<AccountIdRoute>;
  let handler: DummyLoginHandler;

  beforeEach(async(): Promise<void> => {
    input = {
      json: {},
      metadata: new RepresentationMetadata(),
      target: { path: 'http://example.com/' },
      method: 'POST',
    };

    metadata = new RepresentationMetadata({ [CONTENT_TYPE]: 'text/turtle' });
    output = {
      json: { accountId, data: 'data' } as LoginOutputType,
      metadata,
    };

    accountStore = {
      updateSetting: jest.fn(),
    } satisfies Partial<AccountStore> as any;

    cookieStore = {
      generate: jest.fn().mockResolvedValue(cookie),
      delete: jest.fn(),
    } satisfies Partial<CookieStore> as any;

    accountRoute = {
      getPath: jest.fn().mockReturnValue('http://example.com/foo'),
      matchPath: jest.fn().mockReturnValue(true),
    };

    handler = new DummyLoginHandler(accountStore, cookieStore, accountRoute);
  });

  it('removes the ID from the output and adds a cookie.', async(): Promise<void> => {
    await expect(handler.handle(input)).resolves.toEqual({ json: {
      data: 'data',
      cookie,
      resource: 'http://example.com/foo',
    },
    metadata });
    expect(metadata.get(SOLID_HTTP.terms.accountCookie)?.value).toBe(cookie);

    expect(cookieStore.generate).toHaveBeenCalledTimes(1);
    expect(cookieStore.generate).toHaveBeenLastCalledWith(accountId);
    expect(cookieStore.delete).toHaveBeenCalledTimes(0);
    expect(accountStore.updateSetting).toHaveBeenCalledTimes(0);
  });

  it('generates a metadata object if the login handler did not provide one.', async(): Promise<void> => {
    output = { json: { accountId, data: 'data' } as LoginOutputType };
    const result = await handler.handle(input);
    expect(result).toEqual({ json: {
      data: 'data',
      cookie,
      resource: 'http://example.com/foo',
    },
    metadata: expect.any(RepresentationMetadata) });
    expect(result.metadata).not.toBe(metadata);
    expect(result.metadata?.get(CONTENT_TYPE_TERM)).toBeUndefined();
    expect(accountStore.updateSetting).toHaveBeenCalledTimes(0);
  });

  it('adds a location field if there is an OIDC interaction.', async(): Promise<void> => {
    input.oidcInteraction = {
      lastSubmission: { login: { accountId: 'id' }},
      persist: jest.fn(),
      returnTo: 'returnTo',
    } as any;
    await expect(handler.handle(input)).resolves.toEqual({ json: {
      data: 'data',
      cookie,
      resource: 'http://example.com/foo',
      location: 'returnTo',
    },
    metadata });

    expect(input.oidcInteraction!.persist).toHaveBeenCalledTimes(1);
    expect(input.oidcInteraction!.result).toEqual({
      login: { accountId: 'id' },
    });
    expect(accountStore.updateSetting).toHaveBeenCalledTimes(0);
  });

  it('updates the account remember settings if necessary.', async(): Promise<void> => {
    output = {
      json: { ...output.json, remember: true },
      metadata,
    };
    await expect(handler.handle(input)).resolves.toEqual({ json: {
      data: 'data',
      cookie,
      resource: 'http://example.com/foo',
    },
    metadata });

    expect(cookieStore.generate).toHaveBeenCalledTimes(1);
    expect(cookieStore.generate).toHaveBeenLastCalledWith(accountId);
    expect(accountStore.updateSetting).toHaveBeenCalledTimes(1);
    expect(accountStore.updateSetting).toHaveBeenLastCalledWith(accountId, ACCOUNT_SETTINGS_REMEMBER_LOGIN, true);
  });

  it('deletes the old cookie if there was one in the input.', async(): Promise<void> => {
    input.metadata.set(SOLID_HTTP.terms.accountCookie, 'old-cookie-value');
    await expect(handler.handle(input)).resolves.toEqual({ json: {
      data: 'data',
      cookie,
      resource: 'http://example.com/foo',
    },
    metadata });
    expect(metadata.get(SOLID_HTTP.terms.accountCookie)?.value).toBe(cookie);

    expect(cookieStore.generate).toHaveBeenCalledTimes(1);
    expect(cookieStore.generate).toHaveBeenLastCalledWith(accountId);
    expect(cookieStore.delete).toHaveBeenCalledTimes(1);
    expect(cookieStore.delete).toHaveBeenLastCalledWith('old-cookie-value');
    expect(accountStore.updateSetting).toHaveBeenCalledTimes(0);
  });
});
