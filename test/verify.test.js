/* eslint-env mocha */
import assert from 'assert';
import { verify } from '../src/verify.js';

describe('test verify', () => {
  it('should return an error if the link is not a PR', async () => {
    const url = 'http://example.com';
    await verify(url, '123', '123', {
      onsuccess: () => {
        throw new Error('Should not have succeeded');
      },
      onreject: (error) => {
        assert.equal(error, 'Wrong link buddy, try again 😢');
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });

  it('should reject PRs that are in private repos', async () => {
    const url = 'https://github.com/adobe/helix-admin/pull/1';
    await verify(url, '123', '123', {
      onsuccess: () => {
        throw new Error('Should not have succeeded');
      },
      onreject: (error) => {
        assert.equal(
          error,
          'I do not have access to that PR and can only verify PRs in public repos. 🔑',
        );
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });

  it('should return an error if the PR has not been merged', async () => {
    const url =
      'https://github.com/elc9aya2ls612j/helix-project-boilerplate/pull/4'; // a perpetually unmerged PR
    await verify(url, '123', '123', {
      onsuccess: () => {
        throw new Error('Should not have succeeded');
      },
      onreject: (error) => {
        assert.equal(error, 'This PR has not been merged. 😔');
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });

  it('should reject PRs that do not have a verification comment', async () => {
    const url = 'https://github.com/adobe/aem-boilerplate/pull/1';
    await verify(url, '123', '123', {
      onsuccess: () => {
        throw new Error('Should not have succeeded');
      },
      onreject: (error) => {
        assert.equal(
          error,
          'I could not verify that PR. Make sure to include the verification code in the PR comments. 😢',
        );
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });

  it('should reject PRs that have an insufficiently great performance', async () => {
    const url = 'https://github.com/trieloff/minivelove/pull/1';
    await verify(url, '123', '123', {
      onsuccess: () => {
        throw new Error('Should not have succeeded');
      },
      onreject: (error) => {
        assert.equal(
          error,
          "Sorry, couldn't find a performance score of 100. Ask in #aem-chat for help",
        );
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });

  it('should succeed for a valid PR', async () => {
    const url = 'https://github.com/trieloff/test-repo/pull/1';
    await verify(url, '123', '123', {
      onsuccess: (data) => {
        console.log(data);
      },
      onreject: (error) => {
        throw new Error('Should not have rejected with ' + error);
      },
      onerror: (error) => {
        throw new Error('Should not have errored with ' + error);
      },
    });
  });
});
