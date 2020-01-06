import { SelectedLine, Utils, Command, CustomCommandLoader } from './lib';
import { TextLine, window } from 'vscode';

export let config: Command[] = [
    {
        name: "extension.touppercase",
        actions: ["getProcessSelections", "mapSelections($0,$fn)"],
        params: {
            fn: (str: string) => { return str.toUpperCase(); }
        }
    },
    {
        name: "extension.tolowercase",
        actions: ["getProcessSelections", "mapSelections($0,$fn)"],
        params: {
            fn: (str: string) => { return str.toLowerCase(); }
        }
    },
    {
        name: "extension.sort",
        actions: ["getProcessLines", "sort($0,$fn)"],
        params: {
            fn: (a: SelectedLine, b: SelectedLine) => { return a.selectedText.trim().localeCompare(b.selectedText.trim()); }
        }
    },
    {
        name: "extension.sortdesc",
        actions: ["getProcessLines", "sort($0,$fn)"],
        params: {
            fn: (a: SelectedLine, b: SelectedLine) => { return b.selectedText.trim().localeCompare(a.selectedText.trim()); }
        }
    },
    {
        name: "extension.sortbynum",
        actions: ["getProcessLines", "sort($0,$fn)"],
        params: {
            fn: (a: SelectedLine, b: SelectedLine) => {
                let aNum = Utils.toNumber(a.selectedText.trim());
                let bNum = Utils.toNumber(b.selectedText.trim());
                return aNum > bNum ? 1 : aNum === bNum ? 0 : -1;
            }
        }
    },
    {
        name: "extension.sortbynumdesc",
        actions: ["getProcessLines", "sort($0,$fn)"],
        params: {
            fn: (a: SelectedLine, b: SelectedLine) => {
                let aNum = Utils.toNumber(a.selectedText.trim());
                let bNum = Utils.toNumber(b.selectedText.trim());
                return aNum > bNum ? -1 : aNum === bNum ? 0 : 1;
            }
        }
    },
    {
        name: "extension.reverse",
        actions: ["getProcessLines", "reverse($0)"]
    },
    {
        name: "extension.removeemptyline",
        actions: ["getProcessLines", "removeLine($0,$fn)"],
        params: {
            fn: (line: TextLine) => { return line.text === ""; }
        }
    },
    {
        name: "extension.removeemptylinewithwhitespace",
        actions: ["getProcessLines", "removeLine($0,$fn)"],
        params: {
            fn: (line: TextLine) => { return line.isEmptyOrWhitespace; }
        }
    },
    {
        name: "extension.filterline",
        actions: ["getProcessLines", getNumberFilter, "removeLine($0,$1)"]
    },
    {
        name: "extension.removespace",
        actions: ["getProcessLines", "deleteLineChars($0,$pattern)"],
        params: {
            pattern: "^(\\s+)|(\\s+)$"
        }
    },
    {
        name: "extension.base64encode",
        actions: ["getProcessSelection", "mapSelection($0,$fn)"],
        params: {
            fn: (str: string) => { return Buffer.from(str).toString("base64"); }
        }
    },
    {
        name: "extension.base64decode",
        actions: ["getProcessSelection", "mapSelection($0,$fn)"],
        params: {
            fn: (str: string) => { return Buffer.from(str, "base64").toString(); }
        }
    },
    {
        name: "extension.calsum",
        actions: ["getProcessLines", "cal($0,$fn)"],
        params: {
            fn: sum
        }
    },
    {
        name: "extension.calavg",
        actions: ["getProcessLines", "cal($0,$fn)"],
        params: {
            fn: avg
        }
    },
    {
        name: "extension.mark",
        actions: ["getProcessSelections", "mark($0)"]
    },
    {
        name: "extension.unmark",
        actions: ["getProcessSelections", "unmark($0)"]
    },
    {
        name: "extension.md5",
        actions: ["getProcessSelection", "md5($0)"]
    },
    {
        name: "extension.sha1",
        actions: ["getProcessSelection", "sha1($0)"]
    },
    {
        name: "extension.copydoc",
        actions: ["copyDoc"]
    },
    {
        name: "extension.makeuuid",
        allowEditorIsNull: true,
        actions: [Utils.makeUuid, "showMsg($0)"]
    },
    {
        name: "extension.makepass",
        allowEditorIsNull: true,
        actions: [getPassLen, "makepass($0)"]
    },
    {
        name: "extension.custom",
        actions: [CustomCommandLoader.LoadCustomCommandConfig, "selectCustomCommand($0)", "runCustomCommand($1)"]
    }
];

async function getNumberFilter(): Promise<((line: TextLine) => boolean) | undefined> {
    let filter = await window.showInputBox({
        prompt: "输入要筛选的字符串(支持正则)",
    });
    if (!filter) {
        return undefined;
    }
    let regex = new RegExp(filter);
    return (line: TextLine) => {
        let regex = new RegExp(<string>filter);
        return !regex.test(line.text);
    };
}

async function getPassLen(): Promise<number | undefined> {
    let text = await window.showInputBox({
        prompt: "密码长度(6-32位之间)",
        value: "12",
        validateInput: (input: string) => {
            let errMsg = "请输入6-32之间的数字";
            let value = input.trim();
            if (!/^[0-9]+$/.test(value) || parseInt(value) < 6 || parseInt(value) > 32) {
                return errMsg;
            }
            return null;
        }
    });
    if (!text) {
        return undefined;
    }
    return parseInt(text);
}

function avg(nums: number[]): number {
    let sum = 0;
    nums.forEach(num => {
        sum += num;
    });
    return sum / nums.length;
}

function sum(nums: number[]): number {
    let sum = 0;
    nums.forEach(num => {
        sum += num;
    });
    return sum;
}