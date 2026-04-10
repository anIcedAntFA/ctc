- file playwright.config.ts đầy error liên quan typescript, check và fix.
- hiện type pnpm install ra error
  ```sh
Lockfile is up to date, resolution step is skipped
Already up to date


> @ngockhoi96/ctc@0.0.0 prepare /home/ngockhoi96/workspace/github.com/anIcedAntFA/cttc
> lefthook install

│  Error: core.hooksPath is set locally to '/home/ngockhoi96/workspace/github.com/anIcedAntFA/cttc/.git/hooks'                         
│                                                                                                                                      
│  hint: Unset it:                                                                                                                     
│  hint:   git config --unset-all --local core.hooksPath                                                                               
│  hint:                                                                                                                               
│  hint: Run 'lefthook install --reset-hooks-path' to automatically unset it.                                                          
│  hint:                                                                                                                               
│  hint: Run 'lefthook install --force' to install hooks anyway in '/home/ngockhoi96/workspace/github.com/anIcedAntFA/cttc/.git/hooks'.
 ELIFECYCLE  Command failed with exit code 1.
  ```
- type `pnpm run validate` show error like 
```sh
error while checking file:
Command failed: npm pack
```
- should name folder `lib` instead of `utils`. 
- trong source còn khá nhiều chỗ chưa update sang "@ngockhoi96/ctc" mà vẫn là Browser Utils, hãy check và update toàn bộ source as needed.
- update CLAUDE.md, nó đang khá loạn, theo refer từ anthropic thì ko nên qua1 150 lines, hãy tách ra rules, skills, hooks,... nếu cần thiết.
- changeset có tạo file CHANGESET.md auto, ui đẹp đầy đủ như 1 open source ko?
- research thêm kỹ về flow publish npm package với changeset, pnpm, github ci, cần token gì hay OIDC, chọn cách cho security, dễ triển khai,... (https://docs.npmjs.com/trusted-publishers)