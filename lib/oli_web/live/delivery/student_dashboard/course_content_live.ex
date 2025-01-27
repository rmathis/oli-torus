defmodule OliWeb.Delivery.StudentDashboard.CourseContentLive do
  use OliWeb, :live_view

  alias Oli.Delivery.Sections
  alias Oli.Delivery.Metrics

  @impl Phoenix.LiveView
  def mount(
        _params,
        %{"section_slug" => section_slug, "current_user_id" => current_user_id} = _session,
        socket
      ) do
    section =
      Sections.get_section_by_slug(section_slug)
      |> Oli.Repo.preload([:base_project, :root_section_resource])

    hierarchy = %{"children" => Sections.build_hierarchy(section).children}
    current_position = 0
    current_level = 0

    {:ok,
     assign(socket,
       hierarchy: hierarchy,
       current_level_nodes: hierarchy["children"],
       current_position: current_position,
       current_level: current_level,
       scheduled_dates:
         Sections.get_resources_scheduled_dates_for_student(section.slug, current_user_id),
       section: section,
       breadcrumbs_tree: [{current_level, current_position, "Curriculum"}],
       current_user_id: current_user_id
     )}
  end

  @impl Phoenix.LiveView
  def render(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
        <section class="flex flex-col p-8">
          <h4 class="text-base font-semibold mr-auto tracking-wide text-gray-800 h-8">Course Content</h4>
          <span class="text-sm font-normal tracking-wide text-gray-800 mt-2">Find all your course content, material, assignments and class activities here.</span>
        </section>
        <section class="flex flex-row justify-between p-8">
          <div class="text-xs absolute -mt-5"><%= render_breadcrumbs(%{breadcrumbs_tree: @breadcrumbs_tree}) %></div>
          <button phx-click="previous_node" class={if @current_position == 0, do: "grayscale pointer-events-none"}>
            <i class="fa-regular fa-circle-left text-primary text-xl"></i>
          </button>
          <div class="flex flex-col">
            <h4 id="course_browser_node_title" class="text-lg font-semibold tracking-wide text-gray-800 mx-auto h-9"><%= get_resource_name(@current_level_nodes, @current_position, @section.display_curriculum_item_numbering) %> </h4>
            <div class="flex items-center justify-center space-x-3 mt-1">
              <span class="uppercase text-[10px] tracking-wide text-gray-800"><%= "#{get_resource_prefix(get_current_node(@current_level_nodes, @current_position), @section.display_curriculum_item_numbering)} overall progress" %></span>
              <div id="browser_overall_progress_bar" class="w-52 rounded-full bg-gray-200 h-2">
                <div class="rounded-full bg-primary h-2" style={"width: #{get_current_node_progress(@current_level_nodes, @current_position, @current_user_id, @section.id)}%"}></div>
              </div>
            </div>
          </div>
          <button phx-click="next_node" class={if @current_position + 1 == length(@current_level_nodes), do: "grayscale pointer-events-none"}>
            <i class="fa-regular fa-circle-right text-primary text-xl"></i>
          </button>
        </section>
        <%= for {resource, index} <- get_current_node(@current_level_nodes, @current_position)["children"] |> Enum.with_index() do %>
          <section class="flex flex-row items-center w-full p-8">
            <h4
              class={"text-sm font-bold tracking-wide text-gray-800 #{if resource["type"] == "container", do: "underline cursor-pointer"}"}
              phx-click="go_down"
              phx-value-resource_id={resource["id"]}
              phx-value-selected_resource_index={index}
              phx-value-resource_type={resource["type"]}>
              <%= if resource["type"] == "container", do: "#{get_current_node(@current_level_nodes, @current_position)["index"]}.#{resource["index"]} #{resource["title"]}", else: resource["title"] %>
            </h4>
            <span class="w-64 h-10 text-sm tracking-wide text-gray-800 bg-gray-100 rounded-sm flex justify-center items-center ml-auto mr-3"><%= get_resource_scheduled_date(resource["id"], @scheduled_dates) %></span>
            <button class="torus-button primary h-10" phx-click="open_resource" phx-value-resource_slug={resource["slug"]} phx-value-resource_type={resource["type"]}>Open</button>
          </section>
        <% end %>
      </div>
    </div>
    """
  end

  def render_breadcrumbs(%{breadcrumbs_tree: []}), do: nil

  def render_breadcrumbs(assigns) do
    ~H"""
    <div class="flex flex-row space-x-2 divide-x divide-gray-100 dark:divide-gray-700">
      <%= for {target_level, target_position, text} <- Enum.take(@breadcrumbs_tree, 1) do %>
        <button
          phx-click="breadcrumb-navigate"
          phx-value-target_level={target_level}
          phx-value-target_position={target_position}>
          <%= text %>
        </button>
      <% end %>
      <%= for {target_level, target_position, text} <- Enum.drop(@breadcrumbs_tree, 1) do %>
        <span> > </span>
        <button
          phx-click="breadcrumb-navigate"
          phx-value-target_level={target_level}
          phx-value-target_position={target_position}>
          <%= text %>
        </button>
      <% end %>
    </div>
    """
  end

  @impl Phoenix.LiveView
  def handle_event("next_node", _params, socket)
      when length(socket.assigns.current_level_nodes) == socket.assigns.current_position,
      do: {:noreply, socket}

  @impl Phoenix.LiveView
  def handle_event(
        "next_node",
        _params,
        %{assigns: %{breadcrumbs_tree: current_breadcrumbs_tree}} = socket
      ) do
    {current_level, current_position, text} = List.last(current_breadcrumbs_tree)

    updated_breadcrumbs_tree =
      List.replace_at(
        current_breadcrumbs_tree,
        length(current_breadcrumbs_tree) - 1,
        {current_level, current_position + 1, text}
      )

    socket =
      socket
      |> update(:current_position, &(&1 + 1))
      |> assign(:breadcrumbs_tree, updated_breadcrumbs_tree)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_event("previous_node", _params, socket) when socket.assigns.current_position == 0,
    do: {:noreply, socket}

  @impl Phoenix.LiveView
  def handle_event(
        "previous_node",
        _params,
        %{assigns: %{breadcrumbs_tree: current_breadcrumbs_tree}} = socket
      ) do
    {current_level, current_position, text} = List.last(current_breadcrumbs_tree)

    updated_breadcrumbs_tree =
      List.replace_at(
        current_breadcrumbs_tree,
        length(current_breadcrumbs_tree) - 1,
        {current_level, current_position - 1, text}
      )

    socket =
      socket
      |> update(:current_position, &(&1 - 1))
      |> assign(:breadcrumbs_tree, updated_breadcrumbs_tree)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_event("go_down", %{"resource_type" => "page"}, socket), do: {:noreply, socket}

  @impl Phoenix.LiveView
  def handle_event("go_down", %{"selected_resource_index" => selected_resource_index}, socket) do
    current_node =
      get_current_node(socket.assigns.current_level_nodes, socket.assigns.current_position)

    selected_resource_index = String.to_integer(selected_resource_index)

    breadcrumbs_tree =
      socket.assigns.breadcrumbs_tree ++
        [
          {socket.assigns.current_level + 1, selected_resource_index,
           get_resource_prefix(
             current_node,
             socket.assigns.section.display_curriculum_item_numbering
           )}
        ]

    socket =
      socket
      |> update(:current_level, &(&1 + 1))
      |> assign(:current_position, selected_resource_index)
      |> assign(:current_level_nodes, current_node["children"])
      |> assign(:breadcrumbs_tree, breadcrumbs_tree)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_event(
        "breadcrumb-navigate",
        %{"target_level" => target_level, "target_position" => target_position},
        socket
      ) do
    breadcrumbs_tree =
      update_breadcrumbs_tree(
        socket.assigns.breadcrumbs_tree,
        String.to_integer(target_level),
        String.to_integer(target_position)
      )

    current_level_nodes = get_current_level_nodes(breadcrumbs_tree, socket.assigns.hierarchy)

    {level, current_position, _text} = List.last(breadcrumbs_tree)

    socket =
      socket
      |> assign(:breadcrumbs_tree, breadcrumbs_tree)
      |> assign(:current_level, level + 1)
      |> assign(:current_position, current_position)
      |> assign(:current_level_nodes, current_level_nodes)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_event(
        "open_resource",
        %{"resource_slug" => resource_slug, "resource_type" => resource_type},
        socket
      ) do
    {:noreply,
     redirect(socket,
       to:
         Routes.page_delivery_path(
           socket,
           String.to_existing_atom(resource_type),
           socket.assigns.section.slug,
           resource_slug
         )
     )}
  end

  defp update_breadcrumbs_tree(breadcrumbs_tree, 0, _target_position),
    do: [hd(breadcrumbs_tree)]

  defp update_breadcrumbs_tree(breadcrumbs_tree, target_level, target_position) do
    {true, breadcrumbs_tree} =
      Enum.reduce(breadcrumbs_tree, {false, []}, fn b, acc ->
        {level, position, _text} = b
        {found, breadcrumbs_tree} = acc

        if level == target_level and position == target_position and found == false do
          {true, breadcrumbs_tree}
        else
          if found == true do
            {true, breadcrumbs_tree}
          else
            {false, [b | breadcrumbs_tree]}
          end
        end
      end)

    Enum.reverse(breadcrumbs_tree)
  end

  defp get_current_level_nodes(breadcrumbs_tree, hierarchy) do
    {0, current_level_nodes} =
      breadcrumbs_tree
      |> Enum.reduce({length(breadcrumbs_tree) - 1, hierarchy["children"]}, fn b, acc ->
        {steps_remaining, hierarchy} = acc
        {_level, position, _text} = b

        if steps_remaining == 0 do
          {0, hierarchy}
        else
          {steps_remaining - 1, Enum.fetch!(hierarchy, position)["children"]}
        end
      end)

    current_level_nodes
  end

  defp get_current_node(current_level_nodes, current_position),
    do: Enum.fetch!(current_level_nodes, current_position)

  defp get_current_node_progress(
         current_level_nodes,
         current_position,
         current_user_id,
         section_id
       ) do
    case get_current_node(current_level_nodes, current_position) do
      %{"type" => "container", "id" => container_id} ->
        Metrics.progress_for(section_id, current_user_id, container_id)
        |> Map.get(current_user_id)
        |> case do
          nil -> 0.0
          progress -> progress * 100
        end

      %{"type" => "page", "id" => page_id} ->
        Metrics.progress_for_page(section_id, [current_user_id], page_id)
        |> Map.get(current_user_id)
        |> case do
          nil -> 0.0
          progress -> progress * 100
        end

      _ ->
        0.0
    end
  end

  defp get_resource_scheduled_date(resource_id, scheduled_dates) do
    case scheduled_dates[String.to_integer(resource_id)] do
      %{end_date: nil} ->
        "No due date"

      data ->
        "#{scheduled_date_type(data.scheduled_type)} #{Timex.format!(data.end_date, "{YYYY}-{0M}-{0D}")}"
    end
  end

  defp scheduled_date_type(:read_by), do: "Read by"
  defp scheduled_date_type(:inclass_activity), do: "In class on"
  defp scheduled_date_type(_), do: "Due by"

  defp get_resource_name(current_level_nodes, current_position, display_curriculum_item_numbering) do
    current_node = get_current_node(current_level_nodes, current_position)

    "#{get_resource_prefix(current_node, display_curriculum_item_numbering)}: #{current_node["title"]}"
  end

  defp get_resource_prefix(%{"type" => "page"} = page, display_curriculum_item_numbering),
    do: if(display_curriculum_item_numbering, do: "Page #{page["index"]}", else: "Page")

  defp get_resource_prefix(
         %{"type" => "container", "level" => "1"} = unit,
         display_curriculum_item_numbering
       ),
       do: if(display_curriculum_item_numbering, do: "Unit #{unit["index"]}", else: "Unit")

  defp get_resource_prefix(
         %{"type" => "container", "level" => "2"} = module,
         display_curriculum_item_numbering
       ),
       do: if(display_curriculum_item_numbering, do: "Module #{module["index"]}", else: "Module")

  defp get_resource_prefix(
         %{"type" => "container", "level" => _} = section,
         display_curriculum_item_numbering
       ),
       do:
         if(display_curriculum_item_numbering, do: "Section #{section["index"]}", else: "Section")
end
