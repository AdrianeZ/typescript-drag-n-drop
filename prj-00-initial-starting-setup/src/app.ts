interface Validatable {
    value: string | number;
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;

}

function validate(obj: Validatable): boolean {
    const {min, max, minLength, value, maxLength, required} = obj;
    let isValid = true;

    if (typeof value === "string") {
        const trimmedValue = value.trim();
        if (required) {
            isValid = isValid && trimmedValue.length !== 0;
        }

        if (minLength !== undefined) {
            isValid = isValid && trimmedValue.length >= minLength;
        }

        if (maxLength !== undefined) {
            isValid = isValid && trimmedValue.length <= maxLength;
        }
    } else {

        if (min !== undefined) {
            isValid = isValid && value >= min
        }

        if (max !== undefined) {
            isValid = isValid && value <= max
        }
    }

    return isValid;

}


class ProjectList
{
    private templeteElement: HTMLTemplateElement;
    private distElement: HTMLDivElement;
    private nodeToRender: HTMLElement;


    constructor(private type: "active" | "finished") {
        this.templeteElement = document.getElementById("project-list")! as HTMLTemplateElement;
        this.distElement = document.getElementById("app")! as HTMLDivElement;
        const importedNode = document.importNode(this.templeteElement.content, true);
        this.nodeToRender = importedNode.firstElementChild! as HTMLElement;
        this.nodeToRender.id = `${this.type}-projects`;
        this.render();
        this.renderContent();

    }

    private render(): void {
        this.distElement.insertAdjacentElement("beforeend", this.nodeToRender);
    }

    private renderContent(): void
    {
        this.nodeToRender.querySelector("ul")!.id = `${this.type}-project-lists`;
        this.nodeToRender.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
    }
}

class ProjectInput {

    private templeteElement: HTMLTemplateElement;
    private distElement: HTMLDivElement;
    private nodeToRender: HTMLFormElement;
    private titleInputElement: HTMLInputElement;
    private descriptionInputElement: HTMLInputElement;
    private peopleInputElement: HTMLInputElement;

    constructor() {
        this.templeteElement = document.getElementById("project-input")! as HTMLTemplateElement;
        this.distElement = document.getElementById("app")! as HTMLDivElement;
        const importedNode = document.importNode(this.templeteElement.content, true);
        this.nodeToRender = importedNode.firstElementChild! as HTMLFormElement;
        this.nodeToRender.id = "user-input";
        this.titleInputElement = this.nodeToRender.querySelector("#title") as HTMLInputElement;
        this.descriptionInputElement = this.nodeToRender.querySelector("#description") as HTMLInputElement;
        this.peopleInputElement = this.nodeToRender.querySelector("#people") as HTMLInputElement;
        this.configure();
        this.render();

    }

    private configure(): void {
        this.nodeToRender.addEventListener("submit", this.submit.bind(this));
    }

    private render(): void {
        this.distElement.appendChild(this.nodeToRender);
    }

    private submit(event: SubmitEvent): void {
        event.preventDefault();
        const userInput = this.validateInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            console.log(title, description, people);
            this.clearInputs();
        }
    }

    private validateInput(): [string, string, number] | void {
        const title = this.titleInputElement.value;
        const description = this.descriptionInputElement.value;
        const people = Number(this.peopleInputElement.value);
        if (validate({value: title, required: true, minLength: 3}) &&
            validate({value: description, required: true, minLength: 10, maxLength: 100}) &&
            validate({value: people, required: true, min: 1, max: 100})) {
            return [title, description, Number(people)];

        } else {
            alert("Input is Invalid");
        }

    }

    private clearInputs(): void {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }


}

new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");