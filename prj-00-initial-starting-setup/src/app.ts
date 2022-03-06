interface Draggable {
    dragStart(event: DragEvent): void

    dragEnd(event: DragEvent): void
}

interface DragTarget {
    dragOver(event: DragEvent): void

    dragLeave(event: DragEvent): void

    drop(event: DragEvent): void
}

interface Validatable {
    value: string | number;
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;

}

type ProjectType = "active" | "finished";
type projectListener<T> = (projects: T[]) => void;

abstract class State<T> {
    protected listeners: projectListener<T>[] = [];

    addListener(listener: projectListener<T>): void {
        this.listeners.push(listener);
    }
}

class ProjectState extends State<Project> {
    private static instance: ProjectState;
    private projects: Project[] = [];


    private constructor() {
        super();
    }

    addProject(project: Project): void {
        this.projects.push(project);
        this.updateState();
    }

    updateState(): void {
        for (const ln of this.listeners) {
            ln(this.projects);
        }
    }

    static createState() {
        if (this.instance) {
            return this.instance;
        }

        this.instance = new ProjectState();
        return this.instance;
    }

}

const state = ProjectState.createState();

class Project {

    constructor(private title: string, private description: string, private people: number, public type: ProjectType, public id: string = Math.random().toString()) {
    }

    getTitle(): string {
        return this.title;
    }

    setTitle(title: string): void {
        this.title = title;
    }

    getDescription(): string {
        return this.description;
    }

    setDescription(title: string): void {
        this.description = title;
    }

    getPeople(): number {
        return this.people;
    }

    setPeople(people: number): void {
        this.people = people;
    }
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

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    private templeteElement: HTMLTemplateElement;
    protected distElement: T;
    protected nodeToRender: U;


    constructor(templateName: string, distId: string, renderAtStart = true, nodeToRenderId?: string) {
        this.templeteElement = document.getElementById(templateName)! as HTMLTemplateElement;
        this.distElement = document.getElementById(distId)! as T;
        const importedNode = document.importNode(this.templeteElement.content, true);
        this.nodeToRender = importedNode.firstElementChild! as U;
        if (nodeToRenderId) this.nodeToRender.id = nodeToRenderId;
        this.render(renderAtStart);
    }

    private render(atStart: boolean): void {
        this.distElement.insertAdjacentElement(atStart ? "afterbegin" : "beforeend", this.nodeToRender);
    }

    abstract configure(): void;

}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private project: Project;

    constructor(distId: string, project: Project) {
        super("single-project", distId, false, project.id);
        this.project = project;
        this.configure();
    }


    get person(): string {
        return this.project.getPeople() <= 1 ? `${this.project.getPeople()} person assigned` : `${this.project.getPeople()} persons assigned`
    }

    configure() {
        this.nodeToRender.addEventListener("dragstart", this.dragStart.bind(this));
        this.nodeToRender.addEventListener("dragend", this.dragEnd.bind(this));
        this.nodeToRender.querySelector("h2")!.textContent = this.project.getTitle();
        this.nodeToRender.querySelector("h3")!.textContent = this.person;
        this.nodeToRender.querySelector("p")!.textContent = this.project.getDescription();
    }

    dragEnd(event: DragEvent): void {
        console.log("Drag end")
    }

    dragStart(event: DragEvent): void {
        console.log(event);
    }

}


class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    constructor(private type: ProjectType) {
        super("project-list", "app", false, `${type}-projects`);
        this.configure();
    }

    dragOver(event: DragEvent): void {
        const draggedList = this.nodeToRender.querySelector("ul")!;
        draggedList.classList.add("droppable");
        console.log("dragover")
    }

    dragLeave(event: DragEvent): void {
            const leavedList = this.nodeToRender.querySelector("ul")!;
            leavedList.classList.remove("droppable");
        console.log("dragleave");
    }

    drop(event: DragEvent): void {
        throw new Error("Method not implemented");
    }

    configure(): void {
        this.nodeToRender.addEventListener("dragover", this.dragOver.bind(this));
        this.nodeToRender.addEventListener("drop", this.drop.bind(this));
        this.nodeToRender.addEventListener("dragleave", this.dragLeave.bind(this));
        this.nodeToRender.querySelector("ul")!.id = `${this.type}-project-listing`;
        this.nodeToRender.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";

        const stateListener = (projects: Project[]) => {
            const filteredProjects = projects.filter(project => project.type === this.type);
            const ul = this.nodeToRender.querySelector(`#${this.type}-project-listing`)! as HTMLUListElement;
            ul.textContent = "";
            for (let i = 0; i < filteredProjects.length; i++) {
                new ProjectItem(ul.id, filteredProjects[i]);
            }
        }
        state.addListener(stateListener);

    }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    private titleInputElement: HTMLInputElement;
    private descriptionInputElement: HTMLInputElement;
    private peopleInputElement: HTMLInputElement;

    constructor(nodeToRenderId?: string) {
        super("project-input", "app", false, nodeToRenderId);
        this.titleInputElement = this.nodeToRender.querySelector("#title") as HTMLInputElement;
        this.descriptionInputElement = this.nodeToRender.querySelector("#description") as HTMLInputElement;
        this.peopleInputElement = this.nodeToRender.querySelector("#people") as HTMLInputElement;
        this.configure();
    }

    configure(): void {
        this.nodeToRender.addEventListener("submit", this.submit.bind(this));
    }

    private submit(event: SubmitEvent): void {
        event.preventDefault();
        const userInput = this.validateInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            const newProject = new Project(title, description, people, "active");
            state.addProject(newProject);
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

new ProjectInput("project-form");
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");